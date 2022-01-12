import { Media } from "./media";

export interface Timeline {
	query: string;
	media?: Media[];
	nextPageToken?: string;
}
