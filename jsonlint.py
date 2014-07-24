#!/usr/bin/env python

import argparse
import json
import jsonschema
import sys

def main():
  parser = argparse.ArgumentParser(description='Validates the JSON file against a JSON schema')
  parser.add_argument('-f, --filename', help='name of the JSON file', dest='jfn', default='types.json', action='store')
  parser.add_argument('-s, --schema', help='name of the JSON schema file', dest='sfn', default='listTypes.json', action='store')
  args = parser.parse_args()
  jfn = args.jfn
  sfn = args.sfn

  jf = open(jfn,"r")
  jt = jf.read()
  jf.close()
  j = json.loads(jt)

  sf = open(sfn,"r")
  st = sf.read()
  sf.close()
  s = json.loads(st)

  jsonschema.validate(j, s)

if __name__ == "__main__":
  exitCode = main()
  sys.exit(exitCode)
