pipeline {

    /*
     * Jenkins is the main pipeline executor.
     * Docker commands run through the Docker CLI installed
     * in Jenkins and are handled by the DinD daemon.
     */
    agent any

    options {

        // We perform checkout explicitly as a pipeline stage.
        skipDefaultCheckout(true)

        // Add timestamps to console logs.
        timestamps()

        // Keep only the latest 20 builds.
        buildDiscarder(
            logRotator(numToKeepStr: '20')
        )
    }

    environment {

        // Docker Hub repository.
        DOCKER_IMAGE = 'yuguanghao/isec6000-node-app'

        // Use Jenkins build number as the Docker image tag.
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {

                // Checkout the repository containing this Jenkinsfile.
                checkout scm
            }
        }


        stage('Install Dependencies') {

            /*
             * The assignment requires Node 16
             * to be used as the build agent.
             */
            agent {
                docker {
                    image 'node:16'
                    args '-u 1000:1000 -e HOME=/tmp'
                    reuseNode true
                }
            }

            steps {

                // Record Node and npm versions in Jenkins logs.
                sh 'node --version'
                sh 'npm --version'

                // Install exact dependencies from package-lock.json.
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
                 * Save the unit-test output into a file
                 * while also displaying it in Jenkins logs.
                 *
                 * The original npm test exit status is preserved,
                 * so a failed test still fails the pipeline.
                 */
                sh '''
                    set +e

                    npm test > test-result.txt 2>&1
                    status=$?

                    set -e

                    cat test-result.txt

                    exit $status
                '''
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
                 * Generate a machine-readable vulnerability report.
                 *
                 * "|| true" prevents report generation itself from
                 * stopping the pipeline when vulnerabilities exist.
                 */
                sh 'npm audit --json > npm-audit.json || true'

                /*
                 * Security gate:
                 *
                 * Low / Moderate vulnerabilities:
                 * reported but pipeline may continue.
                 *
                 * High / Critical vulnerabilities:
                 * npm returns a non-zero exit code and Jenkins fails.
                 */
                sh 'npm audit --audit-level=high'
            }
        }


        stage('Docker Build') {
            steps {

                /*
                 * Docker CLI inside Jenkins communicates with
                 * the separate Docker-in-Docker daemon.
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
                 * Retrieve Docker Hub username and PAT from
                 * Jenkins Credentials rather than hard-coding
                 * secrets in the Jenkinsfile.
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
            echo 'Pipeline completed successfully.'
            echo "Published image: ${DOCKER_IMAGE}:${IMAGE_TAG}"
        }


        failure {
            echo 'Pipeline failed. Check the failed stage and console logs.'
        }


        always {

            /*
             * Archive important build artifacts so that
             * test and security results can be reviewed later.
             */
            archiveArtifacts(
                artifacts: 'test-result.txt,npm-audit.json',
                fingerprint: true,
                allowEmptyArchive: true
            )

            /*
             * Ensure Docker authentication information
             * is removed after the build.
             */
            sh 'docker logout >/dev/null 2>&1 || true'

            echo "Jenkins build number: ${BUILD_NUMBER}"
        }
    }
}
