# This script is helpful for checking 

# x == [] is always false since javascript is comparing references rather than values
# Use x.length == 0 instead
grep "\=\= \[\]" src/* -r
