namespace API.Entities;

public class Timeline
{
    public List<Tweet> data { get; set; }
    public Includes includes { get; set; }
    public Meta meta { get; set; }
}