import { Media } from "./media";

export interface Timeline {
	username: string;
	media: Media[];
	nextPageToken?: string;
	error?: string;
}
