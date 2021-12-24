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
		HttpResponseMessage response = await _httpClient.GetAsync("users/by/username/" + username);

		//Just treat all errors as user not found, there are many reasons why this request will fail
		//	such as not found, username doesn't match regex etc.
		if (!response.IsSuccessStatusCode) return null;

		var result = await response.Content.ReadFromJsonAsync<UserRequest>();

		if(result.data == null) return null;

		return new UserDto
		{
			Id = result.data.id,
			Username = result.data.username
		};
	}

	[HttpGet("{username}")]
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

		//Peek into the future, check to see if the next tweet exists for "pagination"
		//This is.... not ideal honestly, but with Twitter returning broken pagination tokens
		//	this is a simple fix to not have a weird button that returns nothing
		//
		//Now there is an issue, wherefor max_results 5 is the minimum, also most logical number to put
		//	here considering it's burning API limits that we might not even need to query for...
		//However, some accounts will not return the desired amount, it could be anywhere between [5...100]
		//	which is upsetting, but reinforces the need for V1 access even more
		//
		//
		//Solution here is to not look into the future, and just have a button on the page even if we have 1 image returned
		//This looks like crap because why have a button there? But there is no way to successfully pre-check if there are
		//	any more results than there already is to prevent showing this button other than what we do here...
		//
		//Thankfully, max_results of 100 does not burn 100 tweets in my API limits if less results are returned.
		//So not /entirely/ bad here...
		requestUrl = "users/" + user.Id + "/tweets?max_results=100&exclude=replies,retweets&until_id=" + result.meta.oldest_id;
		response = await _httpClient.GetAsync(requestUrl);

		//The request should never fail if we've gotten this far, and twitter should response with meta.result_count = 0 at worst
		if (!response.IsSuccessStatusCode) return BadRequest("Server error when fetching timeline");
		var future = await response.Content.ReadFromJsonAsync<Timeline>();

		//Create timeline
		var timeline = new TimelineDto
		{
			Username = user.Username,
			Media = new List<MediaDto>(),

			//Alright, sooooo for some reason Twitter's V2 API doesn't provide pagination tokens
			//		for some accounts, or just randomly decides to stop including them in results
			//
			//The solution for this is just to search using the oldest ID returned
			//
			//I tested this in postman and indeed it does fix the weird soft limits imposed by the API
			//
			//The only issue is that it's harder to check how many tweets we have left to query
			//		so for now we'll naturally stop after no results are returned
			NextPageToken = future.meta.result_count > 0 ? result.meta.oldest_id : null //Use oldest ID instead of pagination token
		};

		//If no media but we are paginated, return the media-less timeline which will remove the "Load more results" button
		if(result.includes == null) return Ok(timeline);

		//Map the media and store it into the timelineDto
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
