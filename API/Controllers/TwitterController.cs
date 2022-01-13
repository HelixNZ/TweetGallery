using System.Net.Http.Headers;
using System.Text.RegularExpressions;
using API.DTOs;
using API.Entities;
using API.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace API.Controllers;

public class TwitterController : BaseApiController
{
	private readonly IOptions<TwitterSettings> _config;
	private readonly HttpClient _httpClient;

	public TwitterController(IOptions<TwitterSettings> config)
	{
		_config = config; //API bearer token in here
		_httpClient = new HttpClient();
		_httpClient.BaseAddress = new Uri("https://api.twitter.com/2/");
		_httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _config.Value.ApiBearerToken);
	}

	private async Task<UserDto> GetUserByUsername(string username)
	{
		//Get the user ID from a username
		username = username.Replace("@", ""); //strip @ if there is one
		HttpResponseMessage response = await _httpClient.GetAsync("users/by/username/" + username + "?user.fields=protected");

		//Just treat all errors as user not found, there are many reasons why this request will fail
		//	such as not found, username doesn't match regex etc.
		if (!response.IsSuccessStatusCode) return null;

		var result = await response.Content.ReadFromJsonAsync<UserRequest>();

		if (result.data == null) return null;

		var user = new UserDto
		{
			Id = result.data.id,
			Username = "@" + result.data.username,
			Protected = result.data.Protected
		};

		return user;
	}

	[HttpGet("timeline/{username}")]
	public async Task<ActionResult<TimelineDto>> GetTimeline(string username, [FromQuery] SearchParams searchParams)
	{
		//Test handle
		username = Uri.UnescapeDataString(username); //If it's been encoded
		if (!Regex.IsMatch(username, @"^@(\w{1,15})$")) return BadRequest("Invalid handle passed, does not match regex");

		//Get the timeline for the user, 100 results
		var user = await GetUserByUsername(username);

		if (user == null) return NotFound("User not found");
		if (user.Protected) return Unauthorized("User account is protected");

		var requestUrl = "users/" + user.Id + "/tweets?exclude=replies,retweets";
		var result = await QueryTimeline(requestUrl, user.Username, searchParams);

		return result;
	}

	[HttpGet("tags/{tag}")]
	public async Task<ActionResult<TimelineDto>> SearchTags(string tag, [FromQuery] SearchParams searchParams)
	{
		var tags = Uri.UnescapeDataString(tag).Split(" "); //Decode and split
		if (tags.Count() > 3) return BadRequest("Too many tags, maximum allowed is 3");

		const int maxTagLen = 15;
		string pattern = @"^( ?-| )?((@|#)|((from|to):))?(\w{1," + maxTagLen + "})$";
		//Test each tag to see which tag is failing
		for (int i = 0; i < tags.Count(); ++i)
		{
			if (!Regex.IsMatch(tags[i], pattern))
			{
				if (tags[i].Length > maxTagLen) return BadRequest("Tag too long \"" + tags[i] + "\"");
				return BadRequest("Invalid tag \"" + tags[i] + "\"");
			}
		}

		//Gets by tags last 7 days
		//We are allowed up to 5 tags, so using 2 pre-tags means 3 hashtags can be searched by the user
		var requestUrl = "tweets/search/recent?query=" + Uri.EscapeDataString(tag) + " -is:retweet has:media";
		var result = await QueryTimeline(requestUrl, tag, searchParams);

		return result;
	}

	[HttpGet("video/{id}")]
	public async Task<ActionResult<string>> ResolveVideo(string id)
	{
		//Prevent 301 redirect
		var handler = new HttpClientHandler() 
		{
			AllowAutoRedirect = false
		};

		var client = new HttpClient(handler);
		client.BaseAddress = new Uri("https://fxtwitter.com/");
		HttpResponseMessage response = await client.GetAsync("dir/twitter.com/i/status/" + id);
		
		//301 moved for fxtwitter
		if(response.StatusCode != System.Net.HttpStatusCode.Moved) return NotFound();
		var videoUrl = response.Headers.Location;

		if(videoUrl == null) BadRequest("Error fetching video");
		return Ok(videoUrl);
	}

	private async Task<ActionResult<TimelineDto>> QueryTimeline(string requestUrl, string query, SearchParams searchParams)
	{
		//Pagination token
		requestUrl += "&max_results=100&expansions=attachments.media_keys,author_id&tweet.fields=possibly_sensitive,public_metrics,entities" +
					"&media.fields=media_key,preview_image_url,type,url";

		if (searchParams.Token.Length > 0) requestUrl += "&until_id=" + searchParams.Token;

		HttpResponseMessage response = await _httpClient.GetAsync(requestUrl);
		if (!response.IsSuccessStatusCode) return BadRequest("Internal server error"); //Assume the worst (rate limit or api key issue)

		var result = await response.Content.ReadFromJsonAsync<Timeline>();

		//If no media returned, and pagination token wasn't included, then user had no media off the bat, so assume nothing of interest
		if (searchParams.Token.Length == 0 && result.includes == null) return NoContent();

		//Create timeline
		var timeline = new TimelineDto
		{
			Query = Uri.UnescapeDataString(query),
			NextPageToken = result.meta.oldest_id
		};

		//If no media but we are paginated, return the media-less timeline which will remove the "Load more results" button
		if (result.includes == null || result.includes.media == null) return NoContent();

		//Map the media and store it into the timelineDto
		timeline.Media = new List<MediaDto>(); //Only create the list if there is media
		result.includes.media.ForEach(media =>
		{
			var newMedia = new MediaDto
			{
				Type = media.type,
				MediaUrl = media.url != null ? media.url : media.preview_image_url, //if no url, then it's not a photo, use the preview image instead
				ThumbnailUrl = media.preview_image_url != null ? media.preview_image_url : media.url + "?name=thumb",
			};

			//Find matching tweet
			var matchedTweet = result.data.First(tweet => tweet.attachments != null && tweet.attachments.media_keys.Contains(media.media_key));
			var matchedUser = result.includes.users.First(user => user.id == matchedTweet.author_id);
			newMedia.TweetUrl = "https://twitter.com/" + matchedUser.username + "/status/" + matchedTweet.id;
			newMedia.PossiblySensitive = matchedTweet.possibly_sensitive; //Marked sensitive
			newMedia.Handle = matchedUser.username;

			//Temporary video testing
			if (media.type != "photo") newMedia.MediaUrl = "https://localhost:5001/api/Twitter/video/" + matchedTweet.id.ToString();

			//Filtering
			var passedFilter = false;

			//Filter out low-effort or unrelated posts by scoring public metrics
			var tweetValue = matchedTweet.public_metrics.like_count + matchedTweet.public_metrics.reply_count + matchedTweet.public_metrics.retweet_count;
			if (tweetValue >= searchParams.MinScore) passedFilter = true;

			//Filter out hashtag hijacking by counting how many hashtags are in the tweet
			if (matchedTweet.entities.hashtags != null && matchedTweet.entities.hashtags.Count() >= searchParams.MaxTags) passedFilter = false;

			//If passed both filters, add the media to the list
			if (passedFilter) timeline.Media.Add(newMedia);
		});

		//Lack of images that match the score
		if (timeline.Media.Count() == 0 || timeline.Media == null)
		{
			timeline.Media = null; //Remove for ease of processing on the frontend
			return NoContent();
		}

		return Ok(timeline);
	}
}
