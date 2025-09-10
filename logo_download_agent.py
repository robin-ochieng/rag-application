#!/usr/bin/env python3
"""
Kenya Money Market Fund Logo Downloader
Downloads and organizes logos from CMA-licensed MMF providers in Kenya
"""

import os
import re
import time
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

import requests
from PIL import Image
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.wait import WebDriverWait

# Fund URLs and their names
FUND_URLS = {
    "African_Alliance": "https://www.africanalliance.com/copy-of-about-asset-management",
    "Britam": "https://ke.britam.com/save-and-invest/personal/invest/unit-trust-funds",
    "NCBA": "https://investment-bank.ncbagroup.com/wealth-management/collective-investment-schemes/ncba-money-market-fund/",
    "Zimele": "https://www.zimele.co.ke/savings-plan/",
    "Standard_Chartered": "https://www.sc.com/ke/investments/",
    "CIC": "https://cic.co.ke/",
    "Madison": "https://www.madison.co.ke/investmentmanagers/",
    "Dyer_Blair": "https://www.dyerandblair.com/",
    "Amana_Capital": "https://amanacapital.co.ke/about",
    "Diaspora": "https://diasporainvestmentclub.com/",
    "FCB": "https://firstcommunitybank.co.ke/home/First_Ethical_Opportunities_Fund",
    "Genghis_Capital": "https://www.genghis-capital.com/services/unit-trust-funds/",
    "Mali_Safaricom": "https://www.safaricom.co.ke/media-center-landing/terms-and-conditions/terms-and-conditions-for-mali-investment-product",
    "Sanlam": "http://www.sanlam.co.za/investmentseastafrica/unittrusts/Pages/default.aspx",
    "Nabo_Capital": "https://www.nabocapital.com/",
    "Old_Mutual": "https://www.oldmutual.co.ke/personal/save-and-invest/unit-trusts",
    "Equity": "https://equitygroupholdings.com/ke/investor-relations/eib",
    "Dry_Associates": "https://www.dryassociates.com/",
    "APA": "https://www.apainsurance.org/product_investment.php",
    "Cytonn": "https://cytonn.com/topicals/unit-trust-funds-5",
    "Orient_Life": "https://www.orientlife.co.ke/",
    "Wanafunzi": "https://wanafunzi.co.ke/",
    "ABSA": "https://www.absainvestmentmanagement.co.za/wealth-and-investment-management/personal/investment-products/absa-unit-trusts/",
    "Adam_Capital": "https://adamcapital.co.ke/",
    "Synesis": "https://www.synesis.co.ke/",
    "KCB": "https://ke.kcbgroup.com/for-you/investments",
    "GenAfrica": "https://genafrica.com/unit-trust-fund/",
    "Amaka": "https://ke.amakafund.com/",
    "Jubilee": "https://jubileeinsurance.com/ug/products/jubilee-invest/",
    "Enwealth": "https://enwealth.co.ke/",
    "Kuza": "https://kuza.africa/",
    "Etica": "https://eticacap.com/"
}


class LogoDownloader:
    def __init__(self, output_dir: str = "logos", use_selenium: bool = False):
        """
        Initialize the logo downloader
        
        Args:
            output_dir: Base directory for saving logos
            use_selenium: Whether to use Selenium for JavaScript-heavy sites
        """
        self.output_dir = Path(output_dir)
        self.use_selenium = use_selenium
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        # Create folder structure
        self.setup_folders()
        
        # Initialize Selenium if needed
        self.driver = None
        if use_selenium:
            self.setup_selenium()
    
    def setup_folders(self):
        """Create the required folder structure"""
        folders = [
            self.output_dir / "highres",
            self.output_dir / "web",
            self.output_dir / "mobile",
            self.output_dir / "svg"
        ]
        for folder in folders:
            folder.mkdir(parents=True, exist_ok=True)
    
    def setup_selenium(self):
        """Setup Selenium WebDriver"""
        options = Options()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        self.driver = webdriver.Chrome(options=options)
    
    def find_logo_urls(self, page_url: str, html_content: str) -> List[str]:
        """
        Find potential logo URLs in the HTML content
        
        Args:
            page_url: The page URL for resolving relative paths
            html_content: HTML content to parse
            
        Returns:
            List of potential logo URLs
        """
        soup = BeautifulSoup(html_content, 'html.parser')
        logo_urls = []
        
        # Common logo patterns
        logo_patterns = [
            r'logo',
            r'brand',
            r'header.*\.(png|jpg|jpeg|svg|webp)',
            r'navbar.*\.(png|jpg|jpeg|svg|webp)'
        ]
        
        # Search in img tags
        for img in soup.find_all('img'):
            src = img.get('src', '')
            alt = img.get('alt', '').lower()
            class_name = ' '.join(img.get('class', [])).lower()
            
            # Check if this might be a logo
            if any(pattern in src.lower() or pattern in alt or pattern in class_name 
                   for pattern in ['logo', 'brand']):
                if src:
                    logo_urls.append(urljoin(page_url, src))
        
        # Search in CSS for background images
        for style in soup.find_all(style=True):
            style_text = style['style']
            urls = re.findall(r'url\(["\']?([^"\'()]+)["\']?\)', style_text)
            for url in urls:
                if any(pattern in url.lower() for pattern in ['logo', 'brand']):
                    logo_urls.append(urljoin(page_url, url))
        
        # Search in link tags (for favicon/logo)
        for link in soup.find_all('link', rel=re.compile(r'icon|logo', re.I)):
            href = link.get('href')
            if href:
                logo_urls.append(urljoin(page_url, href))
        
        # Remove duplicates and return
        return list(set(logo_urls))
    
    def download_image(self, url: str, fund_name: str) -> Optional[str]:
        """
        Download an image from URL
        
        Args:
            url: Image URL
            fund_name: Name of the fund for naming the file
            
        Returns:
            Path to saved file or None if failed
        """
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            # Determine file extension
            content_type = response.headers.get('content-type', '')
            if 'svg' in content_type or url.endswith('.svg'):
                ext = 'svg'
            elif 'png' in content_type or url.endswith('.png'):
                ext = 'png'
            elif 'jpeg' in content_type or 'jpg' in content_type or url.endswith(('.jpg', '.jpeg')):
                ext = 'jpg'
            elif 'webp' in content_type or url.endswith('.webp'):
                ext = 'webp'
            else:
                ext = 'png'  # Default
            
            # Save original file
            filename = f"{fund_name}_MMF.{ext}"
            if ext == 'svg':
                filepath = self.output_dir / 'svg' / filename
            else:
                filepath = self.output_dir / 'highres' / filename
            
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            print(f"✓ Downloaded: {filename}")
            return str(filepath)
            
        except Exception as e:
            print(f"✗ Failed to download {url}: {e}")
            return None
    
    def resize_image(self, filepath: str, fund_name: str):
        """
        Create resized versions of the image
        
        Args:
            filepath: Path to original image
            fund_name: Name of the fund
        """
        try:
            # Skip SVG files
            if filepath.endswith('.svg'):
                return
            
            img = Image.open(filepath)
            
            # Convert RGBA to RGB if necessary (for JPEG)
            if img.mode in ('RGBA', 'LA'):
                # Create a white background
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'RGBA':
                    background.paste(img, mask=img.split()[3])
                else:
                    background.paste(img, mask=img.split()[1])
                img = background
            
            # Calculate dimensions maintaining aspect ratio
            original_width, original_height = img.size
            
            # Web version - 200px height
            web_height = 200
            web_width = int((web_height / original_height) * original_width)
            web_img = img.resize((web_width, web_height), Image.Resampling.LANCZOS)
            web_path = self.output_dir / 'web' / f"{fund_name}_MMF.png"
            web_img.save(web_path, 'PNG')
            
            # Mobile version - 100px height
            mobile_height = 100
            mobile_width = int((mobile_height / original_height) * original_width)
            mobile_img = img.resize((mobile_width, mobile_height), Image.Resampling.LANCZOS)
            mobile_path = self.output_dir / 'mobile' / f"{fund_name}_MMF.png"
            mobile_img.save(mobile_path, 'PNG')
            
            print(f"  ↳ Resized: web & mobile versions")
            
        except Exception as e:
            print(f"  ↳ Failed to resize: {e}")
    
    def fetch_page(self, url: str) -> Optional[str]:
        """
        Fetch page content using requests or Selenium
        
        Args:
            url: Page URL
            
        Returns:
            HTML content or None if failed
        """
        try:
            if self.use_selenium and self.driver:
                self.driver.get(url)
                time.sleep(3)  # Wait for JavaScript to load
                return self.driver.page_source
            else:
                response = self.session.get(url, timeout=15)
                response.raise_for_status()
                return response.text
        except Exception as e:
            print(f"Failed to fetch {url}: {e}")
            return None
    
    def process_fund(self, fund_name: str, url: str) -> bool:
        """
        Process a single fund - fetch page, find logo, download and resize
        
        Args:
            fund_name: Name of the fund
            url: Fund website URL
            
        Returns:
            True if successful, False otherwise
        """
        print(f"\nProcessing {fund_name}...")
        
        # Fetch the page
        html = self.fetch_page(url)
        if not html:
            return False
        
        # Find logo URLs
        logo_urls = self.find_logo_urls(url, html)
        if not logo_urls:
            print(f"  ↳ No logos found")
            return False
        
        # Try downloading logos (take first successful one)
        for logo_url in logo_urls[:5]:  # Try up to 5 potential logos
            filepath = self.download_image(logo_url, fund_name)
            if filepath:
                self.resize_image(filepath, fund_name)
                return True
        
        return False
    
    def create_readme(self, successful_funds: List[str]):
        """Create README.txt file"""
        readme_content = f"""Kenya Money Market Fund Logos (CMA-licensed)
Generated: {datetime.now().strftime('%B %Y')}

Successfully Downloaded Funds:
{chr(10).join(f'- {fund}_MMF' for fund in sorted(successful_funds))}

Total: {len(successful_funds)} funds

Folder Structure:
- highres/   : Original high-resolution logos
- web/       : Resized to 200px height
- mobile/    : Resized to 100px height  
- svg/       : SVG format logos (if available)

Note: Some logos may not have been found automatically.
Please verify and manually add missing logos as needed.
"""
        
        readme_path = self.output_dir / "README.txt"
        with open(readme_path, 'w') as f:
            f.write(readme_content)
        print(f"\n✓ Created README.txt")
    
    def create_zip(self):
        """Create zip file of all logos"""
        zip_path = "Kenya_MMF_Logos_v1.0.zip"
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(self.output_dir):
                for file in files:
                    file_path = Path(root) / file
                    arcname = file_path.relative_to(self.output_dir.parent)
                    zipf.write(file_path, arcname)
        print(f"✓ Created {zip_path}")
        return zip_path
    
    def run(self):
        """Run the complete download process"""
        print("Starting Kenya MMF Logo Download Process...")
        print("=" * 50)
        
        successful_funds = []
        failed_funds = []
        
        for fund_name, url in FUND_URLS.items():
            if self.process_fund(fund_name, url):
                successful_funds.append(fund_name)
            else:
                failed_funds.append(fund_name)
            time.sleep(2)  # Be respectful to servers
        
        # Create README
        self.create_readme(successful_funds)
        
        # Create ZIP
        self.create_zip()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"SUMMARY:")
        print(f"✓ Successful: {len(successful_funds)} funds")
        print(f"✗ Failed: {len(failed_funds)} funds")
        
        if failed_funds:
            print(f"\nFailed funds (manual download needed):")
            for fund in failed_funds:
                print(f"  - {fund}")
        
        # Cleanup
        if self.driver:
            self.driver.quit()


def main():
    """Main function"""
    print("Kenya MMF Logo Downloader")
    print("-" * 30)
    
    # Ask user for Selenium usage
    use_selenium = input("Use Selenium for JavaScript-heavy sites? (y/n): ").lower() == 'y'
    
    # Create and run downloader
    downloader = LogoDownloader(use_selenium=use_selenium)
    downloader.run()


if __name__ == "__main__":
    main()