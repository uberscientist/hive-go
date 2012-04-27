HiveGo REST API
============

http://api.hivego.info/ is the base URL for the API.


# GET
## **/boardstate**
This returns a JSON object that is structured like so:


```javascript
    {
      color: -1,
      passes: 0,
      resigns: 3,
      stones: [0,0,-1,1,0,0,...],
      makers: [0,2,0,8,0,0,...],
      caps: { W: 4, B: 2 }
    }
```


Colors are represented by +/- 1. -1 is black, 1 is white and zero (0) represents an empty intersection.
- `color` is the current color
- `passes` and `resigns` are the number of votes for those choices
- `stones` is an array of what stones of what color are commited to the game
- `markers` are the votes for each coordinate
- `caps` is an object containing the amount of points in captures for white and black.

## **/time**
This returns a JSON object containing the UNIX time stamp of when the round ends:


```javascript
    {
      time: 1335510351
    }
```

#POST
## **/vote**


Accepts a JSON string formatted like so: `vote={ x: 4, y: 4 }`. 
`4,4` describes the coordinate of the middle of the board. To vote for a pass or resign, send the respective
choice as a lowercase string: `vote=resign` or `vote=pass`.