#!/usr/bin/env python

import HTMLParser
import argparse
import sys

class IdParser(HTMLParser.HTMLParser):
  def __init__(self):
    HTMLParser.HTMLParser.__init__(self)
    self.data = []

  def handle_starttag(self, tag, attributes):
    for name, value in attributes:
      if name == 'id':
        self.data.append(value)

def main():
  parser = argparse.ArgumentParser(description='Scans the HTML file looking for ids')
  parser.add_argument('-f, --filename', help='name of the HTML file', dest='filename', default='index.html', action='store')
  args = parser.parse_args()    
  filename = args.filename
  parser = IdParser()
  html_file = open(filename, "r")
  html = html_file.read()
  parser.feed(html)
  print parser.data.sort()
  print parser.data

if __name__ == "__main__":
  exitCode = main()
  sys.exit(exitCode)
