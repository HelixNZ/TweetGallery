namespace API.DTOs;

public class MediaDto
{
    public string TweetUrl { get; set; } //link to tweet url
    public string MediaUrl { get; set; } //full-size, photo only. If non-photo, mediaurl & thumbnailurl are equal
    public string ThumbnailUrl { get; set; } //150x150, equals mediaurl thumbnail or media preview (video)
    public string Type { get; set; } //photo, animated_gif, video

    //GIFS and videos are stored as mp4 with the following, but require v1 api to get the filename
	//		  type                   type      media_key	          resolution    id
	//https://video.twimg.com/ext_tw_video/1434056492294938624/pu/vid/1280x720/VuF8YRK9X6IOu289.mp4
}
