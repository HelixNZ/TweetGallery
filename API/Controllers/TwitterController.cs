using System.Net.Http.Headers;
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
		username = username.Replace("@", "");
		HttpResponseMessage response = await _httpClient.GetAsync("users/by/username/" + username + "?user.fields=protected");

		//Just treat all errors as user not found, there are many reasons why this request will fail
		//	such as not found, username doesn't match regex etc.
		if (!response.IsSuccessStatusCode) return null;

		var result = await response.Content.ReadFromJsonAsync<UserRequest>();

		if(result.data == null) return null;

		var user = new UserDto
		{
			Id = result.data.id,
			Username = "@" + result.data.username,
			Protected = result.data.Protected
		};

		return user;
	}

	[HttpGet("timeline/{username}")]
	public async Task<ActionResult<TimelineDto>> GetTimeline(string username, [FromQuery] string token)
	{
		//Get the timeline for the user, 100 results
		var user = await GetUserByUsername(username);
		if (user == null) return Ok(new TimelineDto { Query = username, Error = "Twitter handle doesn't exist!" }); //Could be api limit or missing user
		if (user.Protected) return Ok(new TimelineDto { Query = username, Error = "Twitter account isn't public :c" }); //Protected account

		var requestUrl = "users/" + user.Id + "/tweets" +
					"?max_results=100&expansions=attachments.media_keys" +
					"&media.fields=media_key,preview_image_url,type,url" +
					"&exclude=replies,retweets&tweet.fields=possibly_sensitive";

		//Pagination token, add it if we got it in the query
		if (token != null && token.Length > 0) requestUrl += "&until_id=" + token;

		HttpResponseMessage response = await _httpClient.GetAsync(requestUrl);
		if (!response.IsSuccessStatusCode) return BadRequest("Server error when fetching timeline"); //Assume the worst (rate limit or api key issue)

		var result = await response.Content.ReadFromJsonAsync<Timeline>();

		//If no media returned, and pagination token wasn't included, then user had no media off the bat, so assume nothing of interest
		if (token == null && result.includes == null) return Ok(new TimelineDto { Query = user.Username, Error = user.Username + " hasn't posted any images recently :(" });

		//Create timeline
		var timeline = new TimelineDto
		{
			Query = user.Username,
			NextPageToken = result.meta.oldest_id //Use oldest ID instead of pagination token
		};

		//If no media but we are paginated, return the media-less timeline which will remove the "Load more results" button
		if(result.includes == null) return Ok(timeline);

		//Map the media and store it into the timelineDto
		timeline.Media = new List<MediaDto>(); //Only create the list if there is media
		result.includes.media.ForEach(media =>
		{
			var newMedia = new MediaDto
			{
				Type = media.type,
				MediaUrl = media.url != null ? media.url : media.preview_image_url, //if no url, then it's not a photo, use the preview image instead
				ThumbnailUrl = media.preview_image_url != null ? media.preview_image_url : media.url.Substring(0, media.url.LastIndexOf(".")) + "?format=jpg&name=thumb",
			};

			//Find matching tweet
			var matchedTweet = result.data.First(tweet => tweet.attachments != null && tweet.attachments.media_keys.Contains(media.media_key));
			newMedia.TweetUrl = "https://twitter.com/" + user.Username.Replace("@", "") + "/status/" + matchedTweet.id;
			newMedia.PossiblySensitive = matchedTweet.possibly_sensitive; //nsfw

			//Append
			timeline.Media.Add(newMedia);
		});

		return Ok(timeline);
	}

	[HttpGet("tags/{tag}")]
	public async Task<ActionResult<TimelineDto>> SearchTags(string tag, [FromQuery] string token)
	{
		//Gets by tags last 7 days
		//We are allowed up to 5 tags, so using 2 pre-tags means 3 hashtags can be searched by the user
		var requestUrl = "tweets/search/recent" +
					"?query=" + Uri.EscapeDataString(tag) + " -is:retweet has:media" + //-is:reply
					"&max_results=100&expansions=attachments.media_keys,author_id&tweet.fields=possibly_sensitive,public_metrics" +
					"&media.fields=media_key,preview_image_url,type,url&user.fields=username";

		//Pagination token, add it if we got it in the query
		if (token != null && token.Length > 0) requestUrl += "&until_id=" + token;

		HttpResponseMessage response = await _httpClient.GetAsync(requestUrl);
		if (!response.IsSuccessStatusCode) return BadRequest(response); //Assume the worst (rate limit or api key issue)

		var result = await response.Content.ReadFromJsonAsync<Timeline>();

		//If no media returned, and pagination token wasn't included, then user had no media off the bat, so assume nothing of interest
		if (token == null && result.includes == null) return Ok(new TimelineDto { Query = Uri.UnescapeDataString(tag), Error = "No media found for " + Uri.UnescapeDataString(tag) + " in the past 7 days" });

		//Create timeline
		var timeline = new TimelineDto
		{
			Query = Uri.UnescapeDataString(tag),
			NextPageToken = result.meta.oldest_id
		};

		//If no media but we are paginated, return the media-less timeline which will remove the "Load more results" button
		if(result.includes == null) return Ok(timeline);

		//Map the media and store it into the timelineDto
		timeline.Media = new List<MediaDto>(); //Only create the list if there is media
		result.includes.media.ForEach(media =>
		{
			var newMedia = new MediaDto
			{
				Type = media.type,
				MediaUrl = media.url != null ? media.url : media.preview_image_url, //if no url, then it's not a photo, use the preview image instead
				ThumbnailUrl = media.preview_image_url != null ? media.preview_image_url : media.url.Substring(0, media.url.LastIndexOf(".")) + "?format=jpg&name=thumb",
			};

			//Find matching tweet
			var matchedTweet = result.data.First(tweet => tweet.attachments != null && tweet.attachments.media_keys.Contains(media.media_key));
			var matchedUser = result.includes.users.First(user => user.id == matchedTweet.author_id);
			newMedia.TweetUrl = "https://twitter.com/" + matchedUser.username + "/status/" + matchedTweet.id;
			newMedia.PossiblySensitive = matchedTweet.possibly_sensitive; //nsfw

			//Filter out low-effort or unrelated posts by checking public metrics
			var tweetValue = matchedTweet.public_metrics.like_count + matchedTweet.public_metrics.reply_count + matchedTweet.public_metrics.retweet_count;
			if(tweetValue > 15) timeline.Media.Add(newMedia);
		});

		//Lack of images that match the score
		if(timeline.Media.Count() == 0 || timeline.Media == null)
		{
			timeline.Media = null; //Remove for ease of processing on the frontend
			if(timeline.NextPageToken.Count() == 0 || timeline.NextPageToken == null) timeline.Error = "No media found for " + Uri.UnescapeDataString(tag) + " in the past 7 days";
		}

		return Ok(timeline);
	}
}
