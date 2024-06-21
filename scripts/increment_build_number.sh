#!/bin/bash

# Assuming your Xcode project (fitbox.xcworkspace) is located in 'ios' directory relative to the root
PROJECT_DIR="ios"  # Pass the PROJECT_DIR as an argument

if [ -z "$PROJECT_DIR" ]; then
    echo "PROJECT_DIR is not provided. Exiting."
    exit 1
fi

PLIST_FILE="$PROJECT_DIR/fitbox/Info.plist"  # Adjust this path based on your project structure

# Read current build number
CURRENT_BUILD_NUMBER=$(/usr/libexec/PlistBuddy -c "Print CFBundleVersion" "$PLIST_FILE")

# Increment build number
NEW_BUILD_NUMBER=$((CURRENT_BUILD_NUMBER + 1))

# Update Info.plist with new build number
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $NEW_BUILD_NUMBER" "$PLIST_FILE"

# Print and export the new build number for subsequent steps to use
echo "New Build Number: $NEW_BUILD_NUMBER"
echo "::set-output name=new_build_number::$NEW_BUILD_NUMBER"

# Commit the updated Info.plist
git -C "$PROJECT_DIR" add "$PLIST_FILE"
git -C "$PROJECT_DIR" commit -m "Increment build number to $NEW_BUILD_NUMBER"