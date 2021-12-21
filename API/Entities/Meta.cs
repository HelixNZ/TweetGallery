namespace API.Entities;

public class Meta
{
    public string oldest_id { get; set; }
    public string newest_id { get; set; }
    public int result_count { get; set; }
    public string next_token { get; set; }
    public string previous_token { get; set; }
}