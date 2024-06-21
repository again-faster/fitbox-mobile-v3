#!/bin/bash

# Set path to Info.plist
INFO_PLIST_PATH="ios/fitbox/Info.plist"  # Adjust path as per your project structure

# Check if Info.plist exists
if [ ! -f "$INFO_PLIST_PATH" ]; then
    echo "Error: Info.plist not found at path: $INFO_PLIST_PATH"
    exit 1
fi

# Read current build number
CURRENT_PROJECT_VERSION=$(/usr/libexec/PlistBuddy -c "Print CFBundleVersion" "$INFO_PLIST_PATH")
echo "Current Project Version: $CURRENT_PROJECT_VERSION"
if [ -z "$CURRENT_PROJECT_VERSION" ]; then
    echo "Error: Failed to retrieve CFBundleVersion from Info.plist at path: $INFO_PLIST_PATH"
    exit 1
fi

# Increment build number
NEW_PROJECT_VERSION=$((CURRENT_PROJECT_VERSION + 1))
echo "New Project Version (1): $NEW_PROJECT_VERSION"
# Update Info.plist with new build number
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $NEW_PROJECT_VERSION" "$INFO_PLIST_PATH"

# Print and export the new build number for subsequent steps to use
echo "New Project Version: $NEW_PROJECT_VERSION"
echo "::set-output name=new_project_version::$NEW_PROJECT_VERSION"

# Commit the updated Info.plist if there are changes
# if [ -n "$(git status --porcelain "$INFO_PLIST_PATH")" ]; then
#     git add "$INFO_PLIST_PATH"
#     git commit -m "build: increment project version to $NEW_PROJECT_VERSION" --author="GitHub Actions <actions@github.com>"
#     git push origin HEAD:feat/automate-build-number-2  # change to which branch you are pushing the changes
# fi