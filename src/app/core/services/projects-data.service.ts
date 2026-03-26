import { Injectable, signal } from '@angular/core';
import { Project } from '../../shared/models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectsDataService {
  readonly projects = signal<Project[]>([
    {
      title: 'Book Store',
      description: 'A platform for buying and selling online texts. Users can explore a variety of books and engage in transactions related to literature and knowledge.',
      image: 'assets/images/portfolio/BookStore.png',
      link: 'https://github.com/faisalkhan91/Bookstore',
      tags: ['Angular', 'Web'],
      featured: true,
    },
    {
      title: 'Storm Events',
      description: 'An analysis project focused on understanding severe weather events between 2012 and 2016, leveraging data visualization and statistical methods.',
      image: 'assets/images/portfolio/StormEvents.gif',
      link: 'https://github.com/faisalkhan91/Storm-Events',
      tags: ['Data Analysis', 'Python'],
      featured: true,
    },
    {
      title: 'Backtracking Search',
      description: 'A Python program designed to solve a 6x6 Sudoku grid using the backtracking search algorithm, systematically exploring choices and backtracking when necessary.',
      image: 'assets/images/portfolio/BacktrackingSearch.PNG',
      link: 'https://github.com/faisalkhan91/Backtracking-Search',
      tags: ['Algorithms', 'Python'],
    },
    {
      title: 'Dictionary Application',
      description: 'A GUI-based dictionary app using the Oxford Dictionary API, with vocabulary-building quizzes, integrated thesaurus, and audio pronunciations.',
      image: 'assets/images/portfolio/DictionaryApp.PNG',
      link: 'https://github.com/faisalkhan91/Dictionary-Application',
      tags: ['GUI', 'API'],
    },
    {
      title: 'Insecure File Extraction',
      description: 'Demonstrates the use of path traversal to exploit a poorly coded upload function for malicious code injection onto a web server.',
      image: 'assets/images/portfolio/InsecureFileExtraction.PNG',
      link: 'https://github.com/faisalkhan91/Insecure-File-Extraction',
      tags: ['Security', 'Web'],
    },
    {
      title: 'Jenkins CI/CD',
      description: 'Automates software development processes for efficient deployment using Ansible, Docker, Nginx, PHP, and MySQL.',
      image: 'assets/images/portfolio/JenkinsCICD.PNG',
      link: 'https://github.com/faisalkhan91/Jenkins-CI-CD',
      tags: ['DevOps', 'CI/CD'],
      featured: true,
    },
  ]);
}
