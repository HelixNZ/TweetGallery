using System.Net.Http.Headers;
using System.Text.Json;
using API.Entities;
using API.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace API.Controllers;

public class TwitterController : BaseApiController
{
	private readonly IOptions<TwitterSettings> _config;

	public TwitterController(IOptions<TwitterSettings> config)
	{
		_config = config;
	}

	//Currently we mainly want to retrieve media only with the tweet ID
	//Consider auto grabbing next pagination if <50 media results returned
	//I"m not sure how abusive that can get considering someone with 8k tweets who
	//  tweets hundreds of text-only tweets at a time.
	//
	//This might not be achievable on V2 without getting rate-limited.
	//Elevated may be required to support user accounts who don"t post media regularly
	//
	//For API longetivity if we go public, consider using a DB for caching users, tweets and timelines
	//Probably best to focus on specialized first before including a DBcontext
	//
	//
	//Furthermore, consider after DB added, to apply for elevated access so that
	//  we can adjust this API to be more efficient, using TwitterV1 for media searches
	//  over V2 which doesn"t permit. V1 also supports video media fully.

	[HttpGet("{username}")]
	public async Task<ActionResult<User>> GetUserByUsername(string username)
	{
		//Get the user ID from a username
		var client = new HttpClient();
		var requestUrl = "https://api.twitter.com/2/users/by/username/" + username;
		client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _config.Value.ApiBearerToken);

		HttpResponseMessage response = await client.GetAsync(requestUrl);

		//Just treat all errors as user not found, there are many reasons why this request will fail
		//	such as not found, username doesn"t match regex etc.
		if (!response.IsSuccessStatusCode) return NotFound("Username not found");

		var result = await response.Content.ReadFromJsonAsync<UserRequest>();
		return result.data;
	}

	[HttpGet("timeline/{userid}")]
	public async Task<ActionResult<Timeline>> GetTimeline(string userId)
	{
		//Get the timeline for the user, 100 results
		var client = new HttpClient();
		var requestUrl = "https://api.twitter.com/2/users/" + userId + "/tweets" +
					"?max_results=100&expansions=attachments.media_keys" +
					"&media.fields=duration_ms,height,media_key,preview_image_url,public_metrics,type,url,width" +
					"&exclude=replies,retweets";

		client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _config.Value.ApiBearerToken);

		HttpResponseMessage response = await client.GetAsync(requestUrl);

		if (!response.IsSuccessStatusCode) return BadRequest("Server error fetching timeline");

		var result = await response.Content.ReadFromJsonAsync<Timeline>();

		return Ok(result);
	}

	// [HttpGet("media/{username}")]
	// public async Task<ActionResult<IEnumerable<TwitterMedia>>> GetUserMedia(string username)
	// {
	//     //Get a list of media for the user
	// }
}