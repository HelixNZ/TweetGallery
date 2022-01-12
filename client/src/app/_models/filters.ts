export interface Filters {
	photo: boolean; //Filter photos
	video: boolean;	//Filter videos
	flaggedSensitive: boolean; //Show flagged material
	showFlag: boolean; //Display flag icon
	scoring: boolean; //Toggle filtering by score
	tagLimiting: boolean; //Toggle filtering by tags
	minScore: number; //Minimum tweet score to request from the API
	maxTags: number; //Maximum tags allowed on results (prevents hashtag hijacked tweets)
}
