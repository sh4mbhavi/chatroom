pipeline {
  agent any

  environment {
    DOCKERHUB_USERNAME = 'sh4mbhavi9'
    IMAGE_TAG = '1.0.0'

    
  }

  options {
    skipStagesAfterUnstable()
  }

  stages {
    stage('Running Lints and Tests') {
      steps {
        dir('backend') {
          sh 'npm install'
          sh 'npm run lint'
          sh 'npm run test'
        }
        dir('frontend') {
          sh 'npm install'
          
          sh 'npm run lint'
          sh 'npm run test'
        }
      }
    }
    
    stage('Running Build Docker Image') {
      steps {
        script {
          echo "🚧 Building Docker images..."

          sh """
            docker build -t $DOCKERHUB_USERNAME/chatroom-frontend:$IMAGE_TAG ./frontend
            docker build -t $DOCKERHUB_USERNAME/chatroom-backend:$IMAGE_TAG ./backend
          """
        }
      }
    }

    stage('Push Docker Images') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'docker-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          script {
            echo "🔐 Logging in to Docker Hub..."
            sh """
              echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

              echo "📤 Pushing frontend image..."
              docker push $DOCKERHUB_USERNAME/chatroom-frontend:$IMAGE_TAG

              echo "📤 Pushing backend image..."
              docker push $DOCKERHUB_USERNAME/chatroom-backend:$IMAGE_TAG
            """
          }
        }
      }
    }

    stage('Running Code Quality Analysis') {
      steps {
        withSonarQubeEnv('SonarCloud') {
          withCredentials([string(credentialsId: 'chatroom-sonar-token', variable: 'SONAR_TOKEN')]) {
            script {
              def scannerHome = tool name: 'SonarScanner'
              dir('backend') {
                sh "${scannerHome}/bin/sonar-scanner -Dsonar.login=${SONAR_TOKEN}"
              }
              dir('frontend') {
                sh "${scannerHome}/bin/sonar-scanner -Dsonar.login=${SONAR_TOKEN}"
              }
            }
          }
        }
      }
    }

    stage('Running Security Scan') {
      steps {
        script {
          echo '🔐 Running npm audit on client...'
          sh '''
            cd backend
            npm ci
            echo "📦 Installed client dependencies"
            npm audit --audit-level=high || echo "⚠️ Client audit completed with warnings"
          '''

          echo '🔐 Running npm audit on server...'
          sh '''
            cd frontend
            npm ci
            echo "📦 Installed server dependencies"
            npm audit --audit-level=high || echo "⚠️ Server audit completed with warnings"
          '''

          echo '🔎 Scanning Docker images...'
          sh """
            docker scan $DOCKERHUB_USERNAME/chatroom-frontend:$IMAGE_TAG || echo "⚠️ Vulnerabilities found in client image"
            docker scan $DOCKERHUB_USERNAME/chatroom-backend:$IMAGE_TAG || echo "⚠️ Vulnerabilities found in server image"
          """

          // Optional: Uncomment to fail build on high severity issues
          /*
          def clientAudit = sh(script: "npm audit --json", returnStdout: true)
          def hasHighVuln = clientAudit.contains('"severity":"high"')
          if (hasHighVuln) {
            error('❌ High severity vulnerabilities found in client dependencies.')
          }
          */
        }
      }
    }

    stage('Release Tagging') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'github-credentials', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
          script {
            echo "🏷️ Tagging release as ${IMAGE_TAG}"

            sh '''
              git config user.email "clownsyeet@gmail.com"
              git config user.name "sh4mbhavi"
            '''

            // Bump version in package.json (without creating a Git tag yet)
            sh """
            echo '🔍 Checking backend version...'
            current_backend_version=\$(node -p "require('./backend/package.json').version")
            if [ "\$current_backend_version" != "$IMAGE_TAG" ]; then
              cd backend
              npm version $IMAGE_TAG --no-git-tag-version
              cd ..
            else
              echo "✅ Backend version already at $IMAGE_TAG"
            fi

            echo '🔍 Checking frontend version...'
            current_frontend_version=\$(node -p "require('./frontend/package.json').version")
            if [ "\$current_frontend_version" != "$IMAGE_TAG" ]; then
              cd frontend
              npm version $IMAGE_TAG --no-git-tag-version
              cd ..
            else
              echo "✅ Frontend version already at $IMAGE_TAG"
            fi
          """

            // Commit and push version bump and tag
            sh """
              git fetch --tags

              if git rev-parse "$IMAGE_TAG" >/dev/null 2>&1; then
                echo "🔁 Git tag $IMAGE_TAG already exists. Skipping tag creation."
              else
                echo "🏷️ Creating and pushing Git tag $IMAGE_TAG..."
                git add backend/package.json frontend/package.json
                git commit -m "🔖 Release ${IMAGE_TAG}"
                git remote set-url origin https://${GIT_USER}:${GIT_TOKEN}@github.com/sh4mbhavi/chatroom.git
                git tag $IMAGE_TAG
                git push origin $IMAGE_TAG
              fi
            """
          }
        }
      }
    }

    stage('Deploy to Production') {
      steps {
        sshagent(credentials: ['chatroom-ec2-token']) {
          script {
            def EC2_HOST = 'ec2-user@3.104.38.43' // Replace with your EC2 public IP or DNS

            sh """
              ssh -o StrictHostKeyChecking=no ${EC2_HOST} << 'EOF'
echo "🔁 Switching to project directory..."
cd chatroom

echo "📥 Pulling latest Docker images..."
docker-compose -f docker-compose.prod.yml pull

echo "🚀 Restarting services with docker-compose..."
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Deployment to production complete."
EOF
            """
          }
        }
      }
    }

    stage('Monitoring Check') {
      steps {
        script {
          sh 'curl -f http://3.104.38.43:223/health || echo "❌ Backend health check failed"'
        }
      }
    }


  }
}