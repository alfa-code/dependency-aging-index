pipeline {
    agent any

    environment {
        PATH = "/home/jenkins/yandex-cloud/bin:$PATH"
    }

    stages {
        stage('Prepare') {
            steps {
                echo "------------------------------";

                echo "Версия yc cli";
                sh 'echo $(yc version)';

                echo "------------------------------";

                echo "Версия node";
                sh 'echo $(node -v)';

                echo "------------------------------";

                echo "Проверяем содержимое папки";
                sh 'ls -a';

                echo "------------------------------";
            }
        }

        // stage('Install') {
        //     steps {
        //         sh 'yarn install'
        //     }
        // }

        // stage('Check') {
        //     steps {
        //         echo "Проверяем содержимое папки после установки пакетов";
        //         sh 'ls -a';
        //     }
        // }

        // stage('Build') {
        //     steps {
        //         echo "Сборка";
        //         sh 'yarn build';
        //     }
        // }

        // stage("Commit Changes") {
        //   steps {
        //     sh 'git tag $(npm run get:version --silent)';
        //     sh 'git push --tags';
        //   }
        // }

        stage('Check Build') {
            steps {
                // dir("dist") {
                    
                // }
                echo "Проверяем содержимое папки";
                sh 'ls -a';

                echo "Lib Publishing..."
                withNPM(npmrcConfig:'9680ce5e-6e04-4278-96f4-7b3fa1b68099') {
                    echo "Start Lib Publishing..."
                    sh 'npm publish --access public';
                    echo "End Lib Publishing..."
                }
            }
        }
    }

    post {
        always {
            echo "------------------------------";

            echo "Очищаем workspace";
            deleteDir()

            echo "------------------------------";
        }
    }
}
