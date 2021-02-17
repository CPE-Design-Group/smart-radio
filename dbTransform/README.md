# RepeaterBook Database Cloning

## Export Search as CSV

RepeaterBook allows users with accounts (free) to export any search (including statewide searches) to formats such as CSV. We will export every state as a CSV and run it through this utility.

## Set Up

1. Verify you have [Node.js](https://nodejs.org/en/) installed.
1. Run `npm install` to install required dependencies.
1. Make a copy of `.env_example` from the top level directory of this git repo and rename it to `.env`.
1. Edit the `.env` file to include the credentials provided via Discord.

## Importing a CSV file to Our Database

Run `node transform.js <name_of_exported_csv>`. After completion, the program will output whether or not it was successful. If you have any issues, contact Will.
