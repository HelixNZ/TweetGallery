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
		HttpResponseMessage response = await _httpClient.GetAsync("users/by/username/" + username + "?user.fields=profile_image_url");

		//Just treat all errors as user not found, there are many reasons why this request will fail
		//	such as not found, username doesn't match regex etc.
		if (!response.IsSuccessStatusCode) return null;

		var result = await response.Content.ReadFromJsonAsync<UserRequest>();

		if(result.data == null) return null;

		var user = new UserDto
		{
			Id = result.data.id,
			Username = result.data.username,
			ProfileImage = result.data.profile_image_url
		};

		//Get 400x400 user profile img
		if(user.ProfileImage != null) user.ProfileImage = user.ProfileImage.Substring(0, user.ProfileImage.LastIndexOf("_")) + "_400x400.jpg";

		return user;
	}

	[HttpGet("timeline/{username}")]
	public async Task<ActionResult<TimelineDto>> GetTimeline(string username, [FromQuery] string token)
	{
		//Get the timeline for the user, 100 results
		var user = await GetUserByUsername(username);
		if (user == null) return new TimelineDto { Username = username, Error = "Twitter handle doesn't exist!" }; //Could be api limit or missing user

		var requestUrl = "users/" + user.Id + "/tweets" +
					"?max_results=100&expansions=attachments.media_keys" +
					"&media.fields=media_key,preview_image_url,type,url" +
					"&exclude=replies,retweets";

		//Pagination token, add it if we got it in the query
		if (token != null && token.Length > 0) requestUrl += "&until_id=" + token;

		HttpResponseMessage response = await _httpClient.GetAsync(requestUrl);
		if (!response.IsSuccessStatusCode) return BadRequest("Server error when fetching timeline"); //Assume the worst (rate limit or api key issue)

		var result = await response.Content.ReadFromJsonAsync<Timeline>();

		//If no media returned, and pagination token wasn't included, then user had no media off the bat, so assume nothing of interest
		if (token == null && result.includes == null) return new TimelineDto { Username = user.Username, Error = user.Username + " hasn't posted any images recently :(" };

		//Create timeline
		var timeline = new TimelineDto
		{
			Username = user.Username,
			ProfileImg = user.ProfileImage,
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
			newMedia.TweetUrl = "https://twitter.com/" + user.Username + "/status/" + matchedTweet.id;

			//Append
			timeline.Media.Add(newMedia);
		});

		return Ok(timeline);
	}
}
