#!/usr/bin/env python

import HTMLParser
import argparse
import sys

class ClassParser(HTMLParser.HTMLParser):
  def __init__(self):
    HTMLParser.HTMLParser.__init__(self)
    self.data = []

  def handle_starttag(self, tag, attributes):
    for name, value in attributes:
      if name == 'class':
        classes = value.split(' ')
        for c in classes:
          self.data.append(c)

def uniq(seq): 
   seen = {}
   result = []
   for item in seq:
       marker = item
       if marker in seen: continue
       seen[marker] = 1
       result.append(item)
   return result

def main():
  parser = argparse.ArgumentParser(description='Scans the HTML file looking for ids')
  parser.add_argument('-f, --filename', help='name of the HTML file', dest='filename', default='index.html', action='store')
  args = parser.parse_args()    
  filename = args.filename
  parser = ClassParser()
  html_file = open(filename, "r")
  html = html_file.read()
  parser.feed(html)
  classes = uniq(parser.data)
  classes.sort()
  print classes

if __name__ == "__main__":
  exitCode = main()
  sys.exit(exitCode)
