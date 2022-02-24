#!/bin/bash

for runno in {1..500}
do
    killtime=$(( $RANDOM % 10 + 5 ))
    echo
    echo "== Run ${runno}:  Starting node (killing in ${killtime} seconds):"

		xcrun simctl launch booted org.reactjs.native.example.Bug4358

    sleep ${killtime}

		xcrun simctl terminate booted org.reactjs.native.example.Bug4358
    echo "== Run ${runno}:  node killed"
done
