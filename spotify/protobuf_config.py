"""
potify lyrics protobuf
  cat ./spotify_lyrics.bin | ~/go/bin/protoscope
  ./myenv/bin/protobuf_inspector < ./spotify_lyrics.bin
"""
types = {
  "root": {
    1: ("lyrics")
  },
  "lyrics": {
    2: ("line", "lines"),
    3: ("string", "copyright"),
    4: ("string", "lyrics_id"),
    5: ("string", "contributor"),
    9: ("alternative", "alternatives"),
    10: ("string", "language")
  },
  "line": {
    2: ("string", "words")
  },
  "alternative":{
    1: ("string", "language"),
    2: ("line", "lines")
  }
}