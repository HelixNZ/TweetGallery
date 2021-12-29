export interface Media {
	handle: string;
	tweetUrl: string;
	mediaUrl: string;
	thumbnailUrl: string;
	type: string; //animated_gif, photo, video
	possiblySensitive: boolean;
}
