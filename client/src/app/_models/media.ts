export interface Media {
	media_key: string;
	url?: string;
	type: string; //animated_gif, photo, video
	duration_ms?: number; //video only
	width: number;
	height: number;
	preview_image_url?: string; //video, gif
	public_metrics?: MediaPublicMetrics; //usually video viewcount

	//GIFS and videos are stored as mp4 with the following, but require v1 api to get the filename
	//		  type                   type      media_key	          resolution    id
	//https://video.twimg.com/ext_tw_video/1434056492294938624/pu/vid/1280x720/VuF8YRK9X6IOu289.mp4
}

interface MediaPublicMetrics{
	view_count: number;
}