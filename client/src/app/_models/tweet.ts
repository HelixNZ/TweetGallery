export interface Tweet {
	id: string;
	text: string;
	attachments?: TweetAttachments;
	public_metrics?: TweetMetrics;
}

interface TweetAttachments {
	media_keys?: string[];
}

interface TweetMetrics {
	retweet_count: number,
	reply_count: number,
	like_count: number,
	quote_count: number
}