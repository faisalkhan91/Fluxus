import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

interface Project {
  title: string;
  description: string;
  image: string;
  link: string;
  tags: string[];
}

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css'],
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PortfolioComponent {
  projects = signal<Project[]>([
    {
      title: 'Book Store',
      description: 'This application serves as a platform for buying and selling online texts. Users can explore a variety of books and engage in transactions related to literature and knowledge. 📚🌐',
      image: 'assets/images/portfolio/BookStore.png',
      link: 'https://github.com/faisalkhan91/Bookstore',
      tags: ['Angular', 'Web']
    },
    {
      title: 'Storm Events',
      description: 'The Storm-Events project hosted on GitHub is an endeavor focused on analyzing and understanding severe weather events that occurred between 2012 and 2016. ⛈️',
      image: 'assets/images/portfolio/StormEvents.gif',
      link: 'https://github.com/faisalkhan91/Storm-Events',
      tags: ['Data Analysis', 'Python']
    },
    {
      title: 'Backtracking Search',
      description: 'This project contains a Python program designed to solve a 6x6 Sudoku grid using the backtracking search algorithm. It aims to find a solution by systematically exploring choices and backtracking when necessary.',
      image: 'assets/images/portfolio/BacktrackingSearch.PNG',
      link: 'https://github.com/faisalkhan91/Backtracking-Search',
      tags: ['Algorithms', 'Python']
    },
    {
      title: 'Dictionary Application',
      description: 'This is a GUI-based dictionary app that uses the Oxford Dictionary API. It offers features like vocabulary-building quizzes, integrated thesaurus, and audio pronunciations. 📚🔍',
      image: 'assets/images/portfolio/DictionaryApp.PNG',
      link: 'https://github.com/faisalkhan91/Dictionary-Application',
      tags: ['GUI', 'API']
    },
    {
      title: 'Insecure File Extraction',
      description: 'This project demonstrates the use of path traversal to exploit a poorly coded upload file function for malicious code injection onto a web server.',
      image: 'assets/images/portfolio/InsecureFileExtraction.PNG',
      link: 'https://github.com/faisalkhan91/Insecure-File-Extraction',
      tags: ['Security', 'Web']
    },
    {
      title: 'Jenkins CI/CD',
      description: 'This project aims to automate software development processes for efficient deployment. It utilizes technologies such as Ansible, Docker, Nginx, PHP, and MySQL. 🚀',
      image: 'assets/images/portfolio/JenkinsCICD.PNG',
      link: 'https://github.com/faisalkhan91/Jenkins-CI-CD',
      tags: ['DevOps', 'CI/CD']
    }
  ]);
}
