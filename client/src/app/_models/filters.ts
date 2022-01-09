export interface Filters {
	photo: boolean; //Filter photos
	video: boolean;	//Filter videos
	flaggedSensitive: boolean; //Show flagged material
	showFlag: boolean; //Display flag icon
	scoring: boolean; //Toggle filtering by score
	minScore: number; //Minimum tweet score to request from the API
}
