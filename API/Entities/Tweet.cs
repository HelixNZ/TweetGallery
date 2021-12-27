namespace API.Entities;

public class Tweet
{
    public string id { get; set; }
    public string author_id { get; set; }
    public string text { get; set; }
    public Attachments attachments { get; set; }
    public bool possibly_sensitive { get; set; }
    public PublicMetrics public_metrics { get; set; }
}