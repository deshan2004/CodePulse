<div align="center">

  <h1 align="center">⚡ CodePulse</h1>
  <p align="center"><strong>Automated Software Quality Assurance (SQA) & Performance Dashboard</strong></p>
  
  <p align="center">
    <a href="https://github.com/yourusername/CodePulse/issues">issues</a> •
    <a href="https://github.com/yourusername/CodePulse/pulls">pull requests</a>
  </p>
</div>

---

## 📖 Table of Contents
- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Installation & Setup](#-installation--setup)
- [Usage](#-usage)
- [License](#-license)

---

## 🎯 About the Project

**CodePulse** is an integrated SQA platform designed to automate code quality analysis and track performance metrics for your software projects. It bridges the gap between development workflows and quality monitoring by executing automated scans and aggregating the results into an intuitive, modern user interface.

---

## ✨ Key Features

* 🚀 **Automated Scanning:** Trigger SonarQube scans directly from the dashboard for any registered project with a single click.
* 📊 **Real-time Quality Metrics:** Visualizes critical code health data:
  * Code Duplication Percentage (%)
  * Security Vulnerabilities Count
  * Test Coverage Percentage (%)
  * Total Lines of Code (LoC)
* 🏎️ **Performance Monitoring:** Tracks API endpoint performance including:
  * Average Response Time (ms)
  * Error Rates (%)
  * Throughput (Requests/sec)
* 📂 **Multi-Project Workspace:** Seamlessly manage and analyze multiple repositories/projects within a centralized dashboard.

---

## 🛠️ Tech Stack

**Backend:**
* [![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/) - Python Web Framework
* [![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F2C?style=for-the-badge&logo=sqlalchemy)](https://www.sqlalchemy.org/) - ORM Database Toolkit
* **Database:** PostgreSQL

**Frontend:**
* [![Next.js](https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/) - React Framework
* **Styling:** Tailwind CSS

**Analysis & Testing Tools:**
* [![SonarQube](https://img.shields.io/badge/SonarQube-4E9BCD?style=for-the-badge&logo=sonarqube&logoColor=white)](https://www.sonarqube.org/) - Automated Code Review
* **Mock Performance Testing:** Apache JMeter

---

## ⚙️ Installation & Setup

### Prerequisites
Make sure you have the following installed on your machine:
- Python 3.x
- Node.js
- JDK 21 (configured as `JAVA_HOME`)
- SonarQube Server running locally on `http://localhost:9000`

### 1. Clone the Repository
```bash
git clone [https://github.com/yourusername/CodePulse.git](https://github.com/yourusername/CodePulse.git)
cd CodePulse
