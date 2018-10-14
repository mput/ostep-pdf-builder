#!/bin/bash

if [[ $(find ./Operating_Systems-Three_Easy_Pieces.pdf -type f -size +6M 2>/dev/null) ]]; then
  echo "OK."
  exit 0;
else
  echo "File didn't extist, or too small"
  exit 1;
fi

