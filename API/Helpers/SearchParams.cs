namespace API.Helpers;

public class SearchParams
{
    public string Token { get; set; } = "";
    public int MinScore { get; set; } = 0;
    public int MaxTags { get; set; } = 99;
}
