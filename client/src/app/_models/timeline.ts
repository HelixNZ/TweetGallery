import { Media } from "./media";
import { Tweet } from "./tweet";

export interface Timeline {
	data: Tweet[];
	includes?: TimelineIncludes;
	meta: TimelineMeta;
	//meta
	
}

interface TimelineIncludes {
	media?: Media[];
}

interface TimelineMeta {
	oldest_id: string;
	newest_id: string;
	result_count?: number;
	next_token?: string;
	previous_token?: string;
}