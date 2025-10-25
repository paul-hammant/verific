Fixture convention

- For every PNG, provide a matching .txt with assertions.
- Filenames must match exactly apart from extension, e.g.:
  - should-detect/filenameXyz.png
  - should-detect/filenameXyz.txt

Assertion file format (.txt):

Inside:
keyword one
another keyword

Outside:
keyword to exclude
another to exclude

Sections are optional. If omitted, that set of assertions is skipped.

Folders:
- should-detect/: images where a registration square must be found
- should-not-detect/: images where no valid registration square exists
- mixed/: images with both inside and outside text; crop should include only inside text

