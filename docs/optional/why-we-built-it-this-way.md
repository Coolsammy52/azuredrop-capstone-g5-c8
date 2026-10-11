# Why We Built It This Way (Optional Learning Guide)

Short, simple reasons behind our main choices. Read one section at a time.

## 1. Why a backend API?
The browser must never talk to the database or storage directly. Passwords and keys would have to sit in the browser, where anyone can see them. The API stands in the middle: it checks who you are, follows the rules, then uses the database and storage.

## 2. Why Node.js and Express?
One language (JavaScript) for everyone. Express is small and easy. It has ready-made packages for Azure, PostgreSQL and JWT.

## 3. Why PostgreSQL and Blob Storage?
- **PostgreSQL** keeps information about files: name, size, owner, category. It is easy to search.
- **Blob Storage** keeps the file itself. It is cheap and made for big files.

`files.file_url` connects the two.

## 4. Why the routes / controllers / models folders?
Each folder does one job, so code is easy to find:
- **routes**: which URL calls which function
- **controllers**: check the input and decide the reply
- **models**: all the database queries

## 5. Why a fixed database schema?
Three people use the same tables. If one person renames a column, the others' code breaks. Same names for everyone means fewer problems.

## 6. Why JWT for login?
After login the server gives the browser a signed token. The browser sends it with every request. The server checks the signature and knows who you are. `middleware/auth.js` turns the token into `req.user.id`.

## 7. Why can people only see their own files?
Every query says `WHERE user_id = <logged-in user>`. If you ask for someone else's file you get "not found", so nobody can learn that a file ID exists. Never trust an ID from the browser alone.

## 8. Why are share links built this way?
- The token is random and long, so nobody can guess it.
- The server checks the expiry every time. The browser cannot cheat.
- The download link is short-lived and read-only, so the storage stays private.
- The public page does not show who uploaded the file.

## 9. Why Managed Identity?
The project asks for "Managed Identity or secure credentials". With Managed Identity the Azure VM is trusted by the storage account, so there is no key to leak or to push to GitHub by mistake. For local testing a connection string in `.env` is fine (`.env` is not committed).

## 10. Why environment variables and `.env.example`?
Secrets must never go in Git. Even if you delete them later, they stay in the history. The code reads values from the environment. `.env.example` lists the names, without the values.

## 11. Why a `/health` endpoint?
It answers one question: "Is the app running and can it reach the database?" Nginx, monitors and GitHub Actions use it to check a release.

## 12. Why Nginx and HTTPS?
Nginx sits in front of Node. It handles HTTPS so passwords and tokens are not sent as plain text. It is the one public door; Node stays private.

## 13. Why branches and GitHub Actions?
- Each person works on their own branch, so nobody overwrites another person's work.
- A pull request lets teammates review before code is merged.
- GitHub Actions runs checks and deploys the same way every time.

## 14. Why write docs?
So a teammate, or an AI assistant, can build on our work without asking. Start with [../architecture.md](../architecture.md).

## Frontend choice: to be filled in by the frontend owner
The brief does not name a frontend framework. Whoever chose it, write 3-4 lines here: what did we choose, and why? (If it is React, common reasons are: reusable components like a `FileCard`, a big community, and the page updating by itself when data changes.)
