namespace API.Entities;

public class Tweet
{
    public string id { get; set; }
    public string text { get; set; }
    public Attachments attachments { get; set; }
}