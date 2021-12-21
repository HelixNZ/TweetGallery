namespace API.Entities;

public class Media
{
    public string media_key { get; set; }
    public string type { get; set; }
    public string url { get; set; }
    public int width { get; set; }
    public int height { get; set; }
    public string preview_image_url { get; set; }
    public int duration_ms { get; set; }
    public MediaMetrics public_metrics { get; set; }
}