#!/bin/bash

# Set path to xcodeproj
PROJECT_PATH="ios/fitbox.xcodeproj"  # Adjust path as per your project structure
BRANCH_DEV="dev"
BRANCH_DEV_BUILD="dev-build"

# Function to handle errors
handle_error() {
    echo "Error: $1"
    exit 1
}

# Ensure we are on the correct branch
echo "Switching to $BRANCH_DEV_BUILD branch..."
git checkout $BRANCH_DEV_BUILD || handle_error "Failed to switch to $BRANCH_DEV_BUILD branch"

# Pull latest changes from dev-build branch
echo "Pulling latest changes from $BRANCH_DEV_BUILD branch..."
git pull origin $BRANCH_DEV_BUILD || handle_error "Failed to pull latest changes from $BRANCH_DEV_BUILD branch"

# Pull latest changes from dev branch
echo "Pulling latest changes from $BRANCH_DEV branch..."
git fetch origin $BRANCH_DEV
git checkout $BRANCH_DEV
git pull origin $BRANCH_DEV || handle_error "Failed to pull latest changes from $BRANCH_DEV branch"

# Merge dev into dev-build
echo "Merging $BRANCH_DEV into $BRANCH_DEV_BUILD..."
git checkout $BRANCH_DEV_BUILD
git merge $BRANCH_DEV --allow-unrelated-histories

# Handle merge conflicts
# Stage all changes except for the specific file
echo "Resolving conflicts..."

# Check if there are merge conflicts
if git ls-files -u | grep -q '^'; then
    echo "Merge conflicts detected. Attempting to resolve conflicts..."

    # Resolve conflicts by keeping the incoming changes (the dev branch) for all files
    git diff --name-only --diff-filter=U | while read file; do
        if [ "$file" != "$PROJECT_PATH" ]; then
            echo "Resolving conflict for $file by keeping incoming changes"
            git checkout --theirs "$file"
        else
            echo "Retaining current version for $file"
            git checkout --ours "$file"
        fi
    done

    # Add resolved files to the staging area
    git add .

    # Commit the merge
    git commit -m "fix: resolve merge conflicts with incoming changes except for $PROJECT_PATH"
else
    echo "No merge conflicts detected."
fi

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