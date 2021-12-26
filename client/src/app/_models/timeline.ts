import { Media } from "./media";

export interface Timeline {
	username: string;
	profileImg: string;
	media: Media[];
	nextPageToken?: string;
	error?: string;
}
