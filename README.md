# Twitter Gallery
Personal Angular/DotNet project that allows you to view twitter as a gallery rather than tweets.
Type in your favorite artist/content creator's handle, a topic or even a hashtag to see gallerized results.
Topics and hashtag searches will return up to the last 7 days worth of media posted.

# Notes on results
Currently it uses the V2 api, it may not retrieve the desired about of images currently.
That will be fixed at a later date when I have time, or if I apply for V1.

# TODO
This is a personal timewaster project so it's not finished nor polished.
Don't expect too much from this app currently.

There is so much left for me to do on this before it can be ready for full-time public use.
Below is a list of personal tasks I may do in my spare time:
  - Add a DB for caching to reduce calls to the twitter API (currently it's not ideal, mildly abusive)
  - Request elevated api access so I can make use of media searching in the V1 api
      - This will fix performance, results, api request count, it's much needed before full-time use
      - This will also provide access to video/gif urls which are not currently supported in V2
      - Add support for users to sign in so that they can see accounts they have permission to view
        - This increases rate limits as well as potentially adjusted results (by topic/hashtag)