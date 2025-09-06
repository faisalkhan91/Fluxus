# Fluxus

![FluxusOverview](https://github.com/faisalkhan91/Fluxus/assets/25315418/ea068c29-3c10-4cdc-873e-ec6224bb7478)

A modern, responsive personal portfolio website built with Angular 16, showcasing professional skills, experience, and achievements.

## 🚀 Features

- **Professional Portfolio** - Showcase your work, skills, and achievements
- **Responsive Design** - Optimized for all devices and screen sizes
- **Modern UI/UX** - Clean, professional interface with smooth animations
- **Skills Showcase** - Interactive display of technical and soft skills
- **Experience Timeline** - Professional experience and career highlights
- **Achievements Gallery** - Certifications and accomplishments
- **Portfolio Projects** - Featured work and project showcases
- **Contact Information** - Easy ways to get in touch

## 🛠️ Tech Stack

- **Frontend Framework**: Angular 16
- **Language**: TypeScript
- **Styling**: CSS3 with modern features
- **Testing**: Jasmine & Karma
- **Build Tool**: Angular CLI
- **Version Control**: Git

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- Node.js (version 16 or higher)
- npm (Node Package Manager)
- Angular CLI

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone https://github.com/faisalkhan91/Fluxus.git
cd Fluxus
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
ng serve
```

4. Open your browser and navigate to `http://localhost:4200/`

## 🏗️ Project Structure

```
src/
├── app/
│   ├── core/                 # Core components (header, footer)
│   ├── modules/
│   │   ├── home/            # Home page
│   │   └── profile/         # Profile sections
│   │       ├── overview/    # About me section
│   │       ├── experience/  # Work experience
│   │       ├── skills/      # Technical skills
│   │       ├── portfolio/   # Project showcase
│   │       ├── interests/   # Personal interests
│   │       └── achievements/ # Certifications & awards
│   └── shared/              # Shared components and services
├── assets/                  # Static assets (images, icons)
└── environments/           # Environment configurations
```

## 🎨 Customization

### Adding Your Information

1. **Profile Picture**: Replace `src/assets/images/profile/profile_picture.jpg`
2. **Skills Icons**: Add your skill icons to `src/assets/icons/skills/`
3. **Portfolio Images**: Add project screenshots to `src/assets/images/portfolio/`
4. **Achievement Images**: Add certification images to `src/assets/images/achievements/`

### Updating Content

- **Personal Info**: Edit the respective component files in `src/app/modules/profile/`
- **Skills**: Modify the skills component to reflect your technical abilities
- **Experience**: Update the experience component with your work history
- **Projects**: Add your portfolio projects in the portfolio component

## 🧪 Testing

Run unit tests:
```bash
ng test
```

Run tests with coverage:
```bash
ng test --code-coverage
```

## 🚀 Deployment

### Build for Production

```bash
ng build --prod
```

The build artifacts will be stored in the `dist/fluxus/` directory.

### Deploy to GitHub Pages

1. Install angular-cli-ghpages:
```bash
npm install -g angular-cli-ghpages
```

2. Build and deploy:
```bash
ng build --prod --base-href "https://faisalkhan91.github.io/Fluxus/"
npx angular-cli-ghpages --dir=dist/fluxus
```

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Faisal Khan**
- GitHub: [@faisalkhan91](https://github.com/faisalkhan91)
- LinkedIn: [Faisal Khan](https://linkedin.com/in/faisalkhan91)

## 🙏 Acknowledgments

- Icons provided by [Icons8](https://icons8.com)
- Angular team for the amazing framework
- All contributors and supporters

---

*This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.1.3.*