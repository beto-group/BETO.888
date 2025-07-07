import os
import subprocess
import shutil

def remove_metadata(file_path):
    subprocess.run(['mat2', '-s', file_path])

def optimize_jpeg(file_path):
    new_path = f"{file_path.rsplit('.', 1)[0]}_new.jpg"
    subprocess.run(['convert', file_path, '-resize', '1920x1080', '-strip', '-quality', '85', new_path])
    subprocess.run(['jpegoptim', '--max=85', '--strip-all', new_path])
    return new_path

def optimize_png(file_path):
    new_path = f"{file_path.rsplit('.', 1)[0]}_new.png"
    subprocess.run(['convert', file_path, '-resize', '1920x1080', '-strip', new_path])
    subprocess.run(['pngquant', '--quality=65-80', '--strip', '--skip-if-larger', new_path, '-o', new_path])
    subprocess.run(['optipng', '-o7', new_path])
    return new_path

def optimize_svg(file_path):
    new_path = f"{file_path.rsplit('.', 1)[0]}_new.svg"
    subprocess.run(['svgo', '-o', new_path, file_path])
    return new_path

def compare_and_replace(original_path, new_path):
    original_size = os.path.getsize(original_path)
    new_size = os.path.getsize(new_path)

    if new_size < original_size:
        os.remove(original_path)
        shutil.move(new_path, original_path)
    else:
        os.remove(new_path)
        remove_metadata(original_path)

def optimize_images_in_folder(folder_path):
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            file_path = os.path.join(root, file)
            if file.lower().endswith(('.jpg', '.jpeg')):
                print(f"Optimizing JPEG: {file_path}")
                new_path = optimize_jpeg(file_path)
                compare_and_replace(file_path, new_path)
            elif file.lower().endswith('.png'):
                print(f"Optimizing PNG: {file_path}")
                new_path = optimize_png(file_path)
                compare_and_replace(file_path, new_path)
            elif file.lower().endswith('.svg'):
                print(f"Optimizing SVG: {file_path}")
                new_path = optimize_svg(file_path)
                compare_and_replace(file_path, new_path)

if __name__ == "__main__":
    folder_path = input("Enter the path to the folder containing the images: ")
    optimize_images_in_folder(folder_path)
    print("Image optimization complete.")