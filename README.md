# Blockchain Voting System

A secure, tamper-evident electronic voting application implemented using Node.js and MySQL. This project demonstrates how blockchain technology can be integrated into a web-based voting architecture to ensure data integrity and transparency.

## Description

This system uses a custom permissioned blockchain implementation to record votes. Each vote is mined using a Proof-of-Work (PoW) algorithm and cryptographically linked to the previous block. The architecture prevents database tampering by making any modification to historical data computationally infeasible and immediately detectable.

**Developed for:** M.Sc. Computer Science - Research Project I

## Features

* **Custom Blockchain Ledger:** Implements SHA-256 hashing and a linked-list data structure.
* **Proof-of-Work (PoW):** Basic mining algorithm to regulate block creation.
* **Tamper Evidence:** Automatic detection of data modification in the database.
* **Public Ledger:** Visual interface for voters to inspect the blockchain state.
* **Role-Based Access:** Distinct portals for Administrators and Voters.
* **Double-Voting Prevention:** Enforces "One Person, One Vote" via database constraints.

## Technologies Used

* **Backend:** Node.js, Express.js
* **Database:** MySQL
* **Frontend:** HTML5, Bootstrap 5
* **Security:** Bcrypt (password hashing), Crypto (SHA-256)

## Prerequisites

* Node.js (v14 or higher)
* MySQL Server

## Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/your-username/blockchain-voting-system.git](https://github.com/your-username/blockchain-voting-system.git)
    cd blockchain-voting-system
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Database Setup**
    * Open your MySQL interface (Workbench or Command Line).
    * Create a new database or use the provided `schema.sql` file to initialize the tables.
    * Run the SQL commands inside `schema.sql`.

4.  **Configuration**
    * Ensure your database connection settings (host, user, password, database name) in `db.js` match your local MySQL configuration.

## Usage

1.  **Start the server**
    ```bash
    node app.js
    ```

2.  **Access the application**
    * Open a web browser and navigate to: `http://localhost:3000`

3.  **Default Admin Credentials**
    * **Username:** admin
    * **Password:** admin123
    *(Generated automatically on first run)*
