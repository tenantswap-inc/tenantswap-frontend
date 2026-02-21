#!/bin/bash
echo "==================================="
echo "Running commit script"
echo "==================================="
echo " "

echo "Write your commit message here"
echo "==================================="

read -r -p "Commit Message:" message

echo "$message"
echo " "

# echo "==================================="
# echo "Linting"
# echo "==================================="
# npm run lint

# if [ $? -eq 0 ]; then
#       echo "Linting passed"
# else
#       echo "Linting failed"
#       exit 1
# fi

# echo "==================================="
# echo "Linting Complete"
# echo "==================================="
# echo " "

echo "==================================="
echo "Running Asset Build"
echo "==================================="
echo " "
echo "==================================="
echo "Building...."
echo "==================================="
npm run build
if [ $? -eq 0 ]; then
      echo "==================================="
      echo "Build Complete"
      echo "==================================="
      echo " "
else
      echo "==================================="
      echo "Build Failed"
      echo "==================================="
      echo " "
      exit 1
fi

echo "Committing changes to the repository"
echo "==================================="
echo " "
echo "==================================="
echo "Adding changes to the repository"
echo "==================================="
git add .
echo " "
git commit -m "$message"
echo "==================================="
echo "Committed changes"
echo "==================================="
echo " "
echo "==================================="
echo "Pushing changes to remote repository"
echo "==================================="
echo " "
git push
echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
echo "Changes pushed to remote repository ✅"
# This script is used to commit changes to the repository.
# It is executed automatically by the deployment process.

# Get the current branch name
