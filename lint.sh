# This script is helpful for checking 

# x == [] is always false since javascript is comparing references rather than values
# Use x.length == 0 instead
grep "\=\= \[\]" src/* -r
grep "\!\= \[\]" src/* -r

# Search for debugging helpers
grep "console.log" src/* -r
grep "alert" src/* -r

# Search for redundant semicolons
grep "\;" src/* -r
