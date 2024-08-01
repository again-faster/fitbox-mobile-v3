#!/bin/bash

# Set path to xcodeproj
PROJECT_PATH="ios/fitbox.xcodeproj"  # Adjust path as per your project structure

# Read current build number
# Extract current version placeholder value
CURRENT_PROJECT_VERSION=$(xcodebuild -project $PROJECT_PATH -showBuildSettings | grep "CURRENT_PROJECT_VERSION" | uniq | awk '{print $3}')

echo "Current Project Version: $CURRENT_PROJECT_VERSION"

# Increment build number
NEW_PROJECT_VERSION=$((CURRENT_PROJECT_VERSION + 1))
echo "New Project Version (1): $NEW_PROJECT_VERSION"


# update value to new build version
sed -i '' -e "s/CURRENT_PROJECT_VERSION = [0-9]*;/CURRENT_PROJECT_VERSION = $NEW_PROJECT_VERSION;/g" $PROJECT_PATH/project.pbxproj

echo "Updated CURRENT_PROJECT_VERSION to $NEW_PROJECT_VERSION in XCODEPROJ"


# Commit the updated file if there are changes
if [ -n "$(git status --porcelain "$PROJECT_PATH")" ]; then
    git add "$PROJECT_PATH"
    git commit -m "build: increment project version to $NEW_PROJECT_VERSION" --author="GitHub Actions <actions@github.com>"
    git push origin HEAD:dev-build  # change to which branch you are pushing the changes
fi