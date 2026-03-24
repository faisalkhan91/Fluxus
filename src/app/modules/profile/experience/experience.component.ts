import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

interface TimelineItem {
  type: 'period' | 'job';
  title?: string;
  role?: string;
  duration?: string;
  achievements?: string[];
}

@Component({
  selector: 'app-experience',
  templateUrl: './experience.component.html',
  styleUrls: ['./experience.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperienceComponent {
  experienceItems = signal<TimelineItem[]>([
    { type: 'period', title: 'SoFi' },
    {
      type: 'job',
      role: 'Senior Software Engineer',
      duration: 'March 2024 - Present',
      achievements: ['Worked on the observability team and created monitoring systems.']
    },
    { type: 'period', title: 'Cigna Healthcare' },
    {
      type: 'job',
      role: 'Software Engineer',
      duration: 'October 2019 - March 2024',
      achievements: [
        'Create new and enhance existing application features using AngularJS and RESTful Web Services.',
        'Use pandas and dataframe in python to create visual plots to be displayed in the angular application.',
        'Use Postman to develop and test new RESTful APIs to consume in Angular services.',
        'Built Python and PowerShell scripts to automate standard operating procedures to eliminate repetitive tasks.',
        'Create and deploy CI/CD pipeline for applications using Git, GitHub, Jenkins, and Docker.',
        'Create custom alert and monitoring framework using python and integrate into splunk.',
        'Created custom Framework using python and WC3270 emulator for mainframe alerts.',
        'Create and maintain learning in Confluence and have regular Knowledge Transfer sessions with the team.',
        'Use agile methodologies and practices to develop, build and deploy new code and processes.',
        'Perform sanity, security, and smoke testing on code and script deployments.',
        'Develop Synthetics that automate application checks using either Python, SolarWinds and Dynatrace.',
        'Automate the web application unit tests by using Katalon to create selenium and python scripts.',
        'Approve and deploy code into all environments using udeploy as part of regular DevOps activities.',
        'Support Oracle database data flow in Kafka cluster hosted in OpenShift pods and troubleshoot any related issues.',
        'Perform KSQL queries to test data flow in Apache Kafka cluster and check Kafka streams.'
      ]
    },
    { type: 'period', title: 'DCI Resources, LLC' },
    {
      type: 'job',
      role: 'DevOps Engineer',
      duration: 'September 2018 - November 2019',
      achievements: [
        'Used Git workflows for version control (Source Code Management)',
        'Deployed Web Applications using Azure Web Console and GitHub.',
        'Developed and maintained automated CI/CD pipelines for code deployment using Jenkins and GitLab.',
        'Created python automation using custom SOPs.',
        'Built and deployed Docker containers for implementing Microservice Architecture from Monolithic Architecture.'
      ]
    },
    { type: 'period', title: 'University of New Haven' },
    {
      type: 'job',
      role: 'Python Developer',
      duration: 'January 2017 - May 2018',
      achievements: [
        'Worked on software development requests from the product backlog using Django web server and Python.',
        'Created RESTful API classes to be consumed in our angular frontend.',
        'Maintained the Linux infrastructure hosting the software platform.',
        'Used agile methodology for feature development with sprints set every two months.',
        'Edited the HTML and CSS templates used in outreach and notification mails sent to the students and faculty, respectively.',
        'Maintained PostgreSQL database instance to store data and added models in Django that relate to tables in the database.',
        'Communicated with the product owner with regards to implementation of new features.'
      ]
    },
    {
      type: 'job',
      role: 'Research Assistant',
      duration: 'May 2017 - July 2017',
      achievements: [
        'Executed shell scripts to batch process the data using Mapper and Reducer in Hadoop.',
        'Created a Python Machine Learning model using Linear regression to set a trend line for each processed data.',
        'Plotted charts for the occurrence of each type of storm in R Studio and Spyder using R and Python.'
      ]
    },
    { type: 'period', title: 'Vodafone Group' },
    {
      type: 'job',
      role: 'Infrastructure Engineer',
      duration: 'February 2014 - August 2016',
      achievements: [
        'Participated in planning, implementation, and growth of our infrastructure on AWS.',
        'Wrote python and shell scripts to automate client package installation.',
        'Managed private cloud hosted on the VMware ESXi servers using vSphere web client.',
        'Worked in a huge backup environment consisting of 100+ backup servers and 15,000 client servers.',
        'Created Incremental (Level 1), Full and Archive Log backup policies for Oracle database using RMAN.',
        'Created Full, Incremental and Differential backup policies for Windows, UNIX, and Linux client servers.'
      ]
    },
    { type: 'period', title: 'Mphasis' },
    {
      type: 'job',
      role: 'Linux Administrator',
      duration: 'June 2013 - January 2014',
      achievements: [
        'Managed Red Hat Linux and VMware ESX servers.',
        'Consistently maintained 98% uptime by monitoring with Splunk services.',
        'Deployed server patches and hotfixes with bash scripts.'
      ]
    }
  ]);
}
