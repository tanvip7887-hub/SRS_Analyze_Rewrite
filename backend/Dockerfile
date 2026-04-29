# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Install Node.js (needed for the docx report generation)
RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy requirement files first
COPY requirements.txt .

# Install python dependencies
RUN pip install --no-cache-dir -r requirements.txt
# Download spacy model
RUN python -m spacy download en_core_web_sm

# Copy the rest of the backend files
COPY . .

# Install node dependencies for the export router
RUN cd app/routers && npm install

# Expose the port FastAPI will run on
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
