namespace API.DTOs;

public class TimelineDto
{
    public string Username { get; set; }
    public string ProfileImg { get; set; }
    public List<MediaDto> Media { get; set; }
    public string NextPageToken { get; set; } //May be null if no next page
    public string Error { get; set; } = null; //Error string to pass to the frontend
}
