pipeline {

    /*
     * Jenkins itself is the main pipeline executor.
     * Docker-related stages therefore use the Docker CLI
     * installed in the Jenkins container, which connects
     * to the separate Docker-in-Docker daemon.
     */
    agent any

    /*
     * Avoid Jenkins performing an automatic checkout.
     * We create an explicit Checkout stage instead so that
     * the pipeline flow is clear in the build logs.
     */
    options {
        skipDefaultCheckout(true)
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    environment {

        /*
         * CHANGE THIS to your real Docker Hub username.
         *
         * Example:
         * DOCKER_IMAGE = 'dave123/isec6000-node-app'
         */
        DOCKER_IMAGE = 'yuguanghao/isec6000-node-app'

        /*
         * Every Jenkins build receives a unique number.
         * That number is used as the Docker image tag.
         *
         * Example:
         * Build #5 -> isec6000-node-app:5
         */
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {

                /*
                 * Checkout the Git repository that contains
                 * this Jenkinsfile.
                 */
                checkout scm
            }
        }


        stage('Install Dependencies') {

            /*
             * The assignment requires Node 16 to be used
             * as the build agent.
             *
             * reuseNode keeps the same Jenkins workspace
             * mounted into this temporary Node 16 container.
             */
            agent {
                docker {
                    image 'node:16'
                    args '-u 1000:1000 -e HOME=/tmp'
                    reuseNode true
                }
            }

            steps {

                /*
                 * Print versions into the Jenkins log so that
                 * we have evidence that Node 16 was used.
                 */
                sh 'node --version'
                sh 'npm --version'

                /*
                 * npm ci installs exactly the dependencies
                 * recorded in package-lock.json.
                 */
                sh 'npm ci'
            }
        }


        stage('Unit Test') {

            agent {
                docker {
                    image 'node:16'
                    args '-u 1000:1000 -e HOME=/tmp'
                    reuseNode true
                }
            }

            steps {

                /*
                 * Runs the test script defined in package.json.
                 *
                 * If the test returns a non-zero exit code,
                 * Jenkins automatically fails this stage.
                 */
                sh 'npm test'
            }
        }


        stage('Security Scan') {

            agent {
                docker {
                    image 'node:16'
                    args '-u 1000:1000 -e HOME=/tmp'
                    reuseNode true
                }
            }

            steps {

                /*
                 * Dependency vulnerability security gate.
                 *
                 * Low / Moderate:
                 * reported, but pipeline may continue.
                 *
                 * High / Critical:
                 * npm audit returns a non-zero exit code,
                 * causing the Jenkins pipeline to fail.
                 */
                sh 'npm audit --audit-level=high'
            }
        }


        stage('Docker Build') {
            steps {

                /*
                 * This command runs in the Jenkins container.
                 *
                 * The Docker CLI inside Jenkins connects through
                 * TLS to the Docker daemon running in the DinD
                 * container configured in Task 2.
                 */
                sh '''
                    docker build \
                        -t ${DOCKER_IMAGE}:${IMAGE_TAG} \
                        .
                '''
            }
        }


        stage('Docker Push') {
            steps {

                /*
                 * Docker Hub username and PAT are retrieved from
                 * Jenkins Credentials rather than being stored
                 * directly in this Jenkinsfile.
                 */
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_TOKEN'
                    )
                ]) {

                    sh '''
                        echo "$DOCKER_TOKEN" | \
                        docker login \
                            --username "$DOCKER_USER" \
                            --password-stdin

                        docker push \
                            ${DOCKER_IMAGE}:${IMAGE_TAG}

                        docker logout
                    '''
                }
            }
        }
    }


    post {

        success {
            echo "Pipeline completed successfully."
            echo "Published image: ${DOCKER_IMAGE}:${IMAGE_TAG}"
        }

        failure {
            echo "Pipeline failed. Check the failed stage and console log."
        }

        always {

            /*
             * Make sure Docker login information is removed
             * even if a later command fails.
             */
            sh 'docker logout >/dev/null 2>&1 || true'

            echo "Jenkins build number: ${BUILD_NUMBER}"
        }
    }
}
