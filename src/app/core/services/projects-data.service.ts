import { Injectable, signal } from '@angular/core';
import { Project } from '../../shared/models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectsDataService {
  readonly projects = signal<Project[]>([
    {
      title: 'Bookstore',
      description: 'An Angular web application for browsing and purchasing books online. Built with Angular CLI, TypeScript, and component-driven architecture with routing, services, and responsive HTML/CSS templates.',
      image: 'assets/images/portfolio/BookStore.png',
      link: 'https://github.com/faisalkhan91/Bookstore',
      tags: ['Angular', 'TypeScript', 'HTML', 'CSS'],
      featured: true,
    },
    {
      title: 'Storm Events Analysis',
      description: 'A data analysis project examining NOAA severe weather events from 2012 to 2016. Uses Hadoop MapReduce for large-scale dataset processing and Python for statistical modeling and visualization of storm patterns.',
      image: 'assets/images/portfolio/StormEvents.gif',
      link: 'https://github.com/faisalkhan91/Storm-Events',
      tags: ['Python', 'Hadoop', 'Data Science'],
      featured: true,
    },
    {
      title: 'Jenkins CI/CD Pipeline',
      description: 'An end-to-end CI/CD pipeline built with Jenkins and Ansible. Automates building, testing, and deploying applications using Docker, Nginx, PHP, and MySQL. Includes a Maven-based Java build pipeline with unit testing and artifact management.',
      image: 'assets/images/portfolio/JenkinsCICD.PNG',
      link: 'https://github.com/faisalkhan91/Jenkins-CI-CD',
      tags: ['Jenkins', 'Ansible', 'Docker', 'CI/CD', 'Shell'],
      featured: true,
    },
    {
      title: 'Backtracking Search',
      description: 'A Python program that solves a 6x6 Sudoku grid using the backtracking search algorithm, systematically exploring possible values and backtracking on constraint violations to produce a solved matrix.',
      image: 'assets/images/portfolio/BacktrackingSearch.PNG',
      link: 'https://github.com/faisalkhan91/Backtracking-Search',
      tags: ['Python', 'Algorithms', 'AI'],
    },
    {
      title: 'Dictionary Application',
      description: 'A GUI-based dictionary app built with Python and Tkinter, powered by the Oxford Dictionary API. Features word definitions, etymology, phonetic pronunciation, audio playback, synonyms, antonyms, rhymes, and example usage.',
      image: 'assets/images/portfolio/DictionaryApp.PNG',
      link: 'https://github.com/faisalkhan91/Dictionary-Application',
      tags: ['Python', 'Tkinter', 'API'],
    },
    {
      title: 'Insecure File Extraction',
      description: 'A security demonstration of path traversal exploitation in a poorly coded file upload function, showing how malicious code can be injected onto a web server through insecure file extraction.',
      image: 'assets/images/portfolio/InsecureFileExtraction.PNG',
      link: 'https://github.com/faisalkhan91/Insecure-File-Extraction',
      tags: ['Python', 'Security', 'Web'],
    },
  ]);
}
